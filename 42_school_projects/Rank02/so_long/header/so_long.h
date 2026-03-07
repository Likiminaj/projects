/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   so_long.h                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 15:00:21 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#ifndef SO_LONG_H
# define SO_LONG_H

// include(s)
# include "../libft/libft.h"
# include "../minilibx-linux/mlx.h"
# include "../minilibx-linux/mlx_int.h"
# include <fcntl.h>

// struct(s)
typedef struct s_player
{
	int	player_count;
	int	x_position;
	int	y_position;
}		t_player;

typedef struct s_exit
{
	int	exit_count;
	int	exit_x_position;
	int	exit_y_position;
}		t_exit;

typedef struct s_map_data
{
	char		**map;
	char		**map_flood;
	int			e_count;
	int			c_count;
	int			width;
	int			height;
	int			map_fd;
	int			collectibles;
	t_exit		*exit;
	t_player	*player;
}		t_map_data;

typedef struct s_mlx
{
	void		*mlx_ptr;
	void		*mlx_window;
	void		*player_image;
	void		*collectible_image;
	void		*exit_closed_image;
	void		*exit_open_image;
	void		*wall_image;
	void		*floor_image;
	int			current_direction;
	int			total_steps;
	t_map_data	*game_map;
}		t_mlx;

// prototype(s)
int		ft_is_map_object(int c);
int		ft_handle_keypress(int keycode, t_mlx *mlx);
int		ft_close_window(t_mlx *mlx);
void	ft_free_map(char **str);
void	ft_close_fd(int fd);
void	ft_clean_map_and_fd(t_mlx *mlx);
void	ft_validate_map(t_map_data *map_data);
void	ft_check_path(t_map_data *map_data);
void	ft_error(char *str, t_map_data *map_data);
void	ft_load_images(t_mlx *mlx);
void	ft_draw_tile(t_mlx *mlx, char tile, int x, int y);
void	ft_draw_map(t_mlx *mlx);
void	ft_setup_hooks(t_mlx *mlx);
void	ft_move_player(t_mlx *mlx, int dx, int dy);

#endif
